require 'json'
require 'fileutils'

Jekyll::Hooks.register :site, :post_write do |site|
  # Collect metadata for each thing, now including geo-restriction and coordinates
  things = site.collections['things'].docs.map do |doc|
    {
      id: doc.data['slug'] || doc.basename_without_ext,
      title: doc.data['title'],
      country: doc.data['country'],
      duration: doc.data['duration'],
      online: doc.data['online'],
      categories: doc.data['categories'],
      url: doc.url,
      geo_restricted: doc.data['geo_restricted'] || false,
      lat: doc.data['lat'],
      lng: doc.data['lng']
    }
  end

  # Create the metadata JSON for items
  data_dir = File.join(site.dest, 'assets', 'data')
  FileUtils.mkdir_p(data_dir)
  File.open(File.join(data_dir, 'things-metadata.json'), 'w') do |f|
    f.write(JSON.pretty_generate(things))
  end

  # Generate dynamic filters from metadata
  all_categories = things.flat_map { |t| t[:categories] }.uniq.sort
  all_countries  = things.map { |t| t[:country] }.uniq.sort
  all_durations  = things.map { |t| t[:duration] }.uniq.sort
  all_online     = [true, false]  # or you could compute dynamically if needed

  filters_js = <<~JS
    const filtersData = {
      categories: #{JSON.pretty_generate(all_categories)},
      country: #{JSON.pretty_generate(all_countries)},
      duration: #{JSON.pretty_generate(all_durations)},
      online: #{JSON.pretty_generate(all_online)}
    };
  JS

  File.open(File.join(data_dir, 'filters.js'), 'w') do |f|
    f.write(filters_js)
  end
end
