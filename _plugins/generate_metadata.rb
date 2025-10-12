require 'json'

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

  FileUtils.mkdir_p(File.join(site.dest, 'assets', 'data'))
  File.open(File.join(site.dest, 'assets', 'data', 'things-metadata.json'), 'w') do |f|
    f.write(JSON.pretty_generate(things))
  end
end
