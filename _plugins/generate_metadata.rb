require 'json'
require 'fileutils'

Jekyll::Hooks.register :site, :post_write do |site|
  things = site.collections['things'].docs.map do |doc|
    {
      id: doc.data['slug'] || doc.basename_without_ext,
      title: doc.data['title'],
      country: doc.data['country'],
      duration: doc.data['duration'],
      online: doc.data['online'],
      categories: doc.data['categories'],
      url: doc.url
    }
  end

  # Create the metadata JSON for items
  data_dir = File.join(site.dest, 'assets', 'data')
  FileUtils.mkdir_p(data_dir)
  File.open(File.join(data_dir, 'things-metadata.json'), 'w') do |f|
    f.write(JSON.pretty_generate(things))
  end

  # Generate dynamic filters
  all_categories = things.flat_map { |t| t[:categories] }.uniq.sort
  all_countries  = things.map { |t| t[:country] }.uniq.sort
  all_durations  = things.map { |t| t[:duration] }.uniq.sort
  all_online     = [true, false]  # You can optionally filter based on which values exist

  filters = {
    'categories' => all_categories,
    'country'    => all_countries,
    'duration'   => all_durations,
    'online'     => all_online
  }

  File.open(File.join(data_dir, 'things-filters.json'), 'w') do |f|
    f.write(JSON.pretty_generate(filters))
  end
end
