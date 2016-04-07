require 'digest/md5'

module Jekyll
  module GravatarFilter

    # Add our new liquid filter.
    def get_gravatar(input)
      "//www.gravatar.com/avatar/#{hash(input)}"
    end

    private :hash

    # Clean up the email address and return hashed version.
    def hash(email)
      email_address = email ? email.downcase.strip : ''
      Digest::MD5.hexdigest(email_address)
    end
  end
end

Liquid::Template.register_filter(Jekyll::GravatarFilter)
